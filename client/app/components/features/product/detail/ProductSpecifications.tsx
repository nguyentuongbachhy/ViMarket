import { ChevronDown, ChevronUp } from 'lucide-react';
import React, { useState } from 'react';
import type { ProductSpecification } from '~/api';
import { cn } from '~/lib/utils';

interface ProductSpecificationsProps {
    specifications: ProductSpecification[];
    className?: string;
    maxItemsBeforeCollapse?: number;
}

export const ProductSpecifications: React.FC<ProductSpecificationsProps> = ({
    specifications,
    className,
    maxItemsBeforeCollapse = 5
}) => {
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

    if (!specifications.length) {
        return (
            <div className={cn("text-center py-12", className)}>
                <svg className="w-16 h-16 mx-auto mb-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-slate-500 text-lg">Chưa có thông số kỹ thuật</p>
                <p className="text-slate-600 text-sm mt-1">Thông tin sẽ được cập nhật sớm</p>
            </div>
        );
    }

    // Group specifications by spec_group
    const groupedSpecs = specifications.reduce((acc, spec) => {
        const group = spec.specGroup || 'Thông tin chung';
        if (!acc[group]) {
            acc[group] = [];
        }
        acc[group].push(spec);
        return acc;
    }, {} as Record<string, ProductSpecification[]>);

    const toggleGroup = (groupName: string) => {
        const newExpanded = new Set(expandedGroups);
        if (newExpanded.has(groupName)) {
            newExpanded.delete(groupName);
        } else {
            newExpanded.add(groupName);
        }
        setExpandedGroups(newExpanded);
    };

    return (
        <div className={cn("space-y-6", className)}>
            <div className="flex items-center space-x-3">
                <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full"></div>
                <h2 className="text-2xl font-bold text-white">Thông số kỹ thuật</h2>
            </div>

            <div className="space-y-4">
                {Object.entries(groupedSpecs).map(([groupName, specs], groupIndex) => {
                    const isExpanded = expandedGroups.has(groupName);
                    const shouldCollapse = specs.length > maxItemsBeforeCollapse;
                    const displaySpecs = isExpanded || !shouldCollapse ? specs : specs.slice(0, maxItemsBeforeCollapse);

                    return (
                        <div
                            key={groupName}
                            className="border border-slate-600 rounded-xl overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 shadow-lg"
                        >
                            {/* Group Header */}
                            <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-4 border-b border-slate-600">
                                <div className="flex items-center space-x-3">
                                    <div className={cn(
                                        "w-3 h-3 rounded-full",
                                        groupIndex % 4 === 0 ? "bg-blue-500" :
                                            groupIndex % 4 === 1 ? "bg-green-500" :
                                                groupIndex % 4 === 2 ? "bg-purple-500" : "bg-yellow-500"
                                    )} />
                                    <h3 className="font-semibold text-white text-lg">{groupName}</h3>
                                    <span className="bg-slate-600 text-slate-300 px-2 py-1 rounded-full text-xs">
                                        {specs.length} mục
                                    </span>
                                </div>
                            </div>

                            {/* Specifications Table */}
                            <div className="divide-y divide-slate-700">
                                {displaySpecs.map((spec, index) => (
                                    <div
                                        key={spec.id}
                                        className={cn(
                                            "px-6 py-4 hover:bg-slate-700/50 transition-colors",
                                            index % 2 === 0 ? "bg-slate-800/50" : "bg-slate-900/50"
                                        )}
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="md:col-span-1">
                                                <span className="font-medium text-slate-300 text-sm uppercase tracking-wide">
                                                    {spec.specName}
                                                </span>
                                            </div>
                                            <div className="md:col-span-2">
                                                {spec.specValue ? (
                                                    <div
                                                        className="text-white leading-relaxed [&>ul]:list-disc [&>ul]:ml-4 [&>ol]:list-decimal [&>ol]:ml-4"
                                                        dangerouslySetInnerHTML={{ __html: spec.specValue }}
                                                    />
                                                ) : (
                                                    <span className="text-slate-500 italic">Không có thông tin</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Show More/Less Button */}
                            {shouldCollapse && (
                                <div className="px-6 py-4 bg-slate-700/30 border-t border-slate-600">
                                    <button
                                        onClick={() => toggleGroup(groupName)}
                                        className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 font-medium text-sm transition-colors group"
                                    >
                                        {isExpanded ? (
                                            <>
                                                <ChevronUp size={16} className="group-hover:-translate-y-0.5 transition-transform" />
                                                <span>Ẩn bớt ({specs.length - maxItemsBeforeCollapse} thông số)</span>
                                            </>
                                        ) : (
                                            <>
                                                <ChevronDown size={16} className="group-hover:translate-y-0.5 transition-transform" />
                                                <span>Xem thêm {specs.length - maxItemsBeforeCollapse} thông số</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Summary Stats */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg p-4 border border-slate-600">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Tổng số thông số:</span>
                    <span className="text-white font-medium">{specifications.length} mục</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-slate-400">Nhóm thông số:</span>
                    <span className="text-white font-medium">{Object.keys(groupedSpecs).length} nhóm</span>
                </div>
            </div>
        </div>
    );
};