#ifndef N_LAYOUT_WIDGET_H
#define N_LAYOUT_WIDGET_H

#include "n_file_widget.h"
#include "native_bridge.h"
#include "util/n_json.h"

#include <QTableView>
#include <QTreeWidgetItem>

namespace Ui {
class NLayoutWidget;
}

class NLayoutWidget : public NFileWidget
{
    Q_OBJECT

public:
    enum ViewsCol {ViewsColId, ViewsColClass};
    enum ViewClassCol {ViewClassColName, ViewClassColClass};
    static const QString HtmlFilePath;

    explicit NLayoutWidget(const QString &filePath, QWidget *parent = 0);
    virtual void refreshForActive();
    ~NLayoutWidget();

protected:
    virtual bool innerSave();

private:
    Ui::NLayoutWidget *ui;
    NativeBridge *mNative;

    QTableView *mCurrentExtraTableView;
    QMap<QString, QTableView*> mPropMap;
    QMap<QString, NJson> mDefaultMap;

    QString contentLayoutJsonText() const;

private slots:
    void toggleLayerTreeWidget();
    void toggleLayoutPropWidget();
    void toggleViewClassTreeWidget();
    void showLayoutSettingDialog();

    void contextMenuForViewsTree(const QPoint &point);
    void contextMenuForWebView(const QPoint &point);
    void injectNativeBridge();
    void setViewsFromJS(const NJson &views);
    void updateViewsToJS(QTreeWidgetItem *droppedItem);
    void selectViewToJS();
    void addViewToJS(QTreeWidgetItem *item, int index);
    void deleteSelectedViewsToJS();
    void setSelectedsViewsFromJS(const NJson &json);
    void syncWidgetToView();
    void setViewPosFromJS(int x, int y);
    void setViewSizeFromJS(int width, int height);

    void alignLeftToJS() { emit mNative->alignSelectedViewsToJS("LEFT"); }
    void alignHCenterToJS() { emit mNative->alignSelectedViewsToJS("H_CENTER"); }
    void alignRightToJS() { emit mNative->alignSelectedViewsToJS("RIGHT"); }
    void alignTopToJS() { emit mNative->alignSelectedViewsToJS("TOP"); }
    void alignVCenterToJS(){ emit mNative->alignSelectedViewsToJS("V_CENTER"); }
    void alignBottomToJS() { emit mNative->alignSelectedViewsToJS("BOTTOM"); }

    void alignRootLeftToJS() { emit mNative->alignSelectedViewsToJS("ROOT_LEFT"); }
    void alignRootHCenterToJS() { emit mNative->alignSelectedViewsToJS("ROOT_H_CENTER"); }
    void alignRootRightToJS() { emit mNative->alignSelectedViewsToJS("ROOT_RIGHT"); }
    void alignRootTopToJS() { emit mNative->alignSelectedViewsToJS("ROOT_TOP"); }
    void alignRootVCenterToJS(){ emit mNative->alignSelectedViewsToJS("ROOT_V_CENTER"); }
    void alignRootBottomToJS() { emit mNative->alignSelectedViewsToJS("ROOT_BOTTOM"); }

    void arrangeHorizontalClosely() { emit mNative->arrangeSelectedViewsToJS("H_CLOSELY"); }
    void arrangeVerticalClosely() { emit mNative->arrangeSelectedViewsToJS("V_CLOSELY"); }
    void arrangeHorizontalEven() { emit mNative->arrangeSelectedViewsToJS("H_EVEN"); }
    void arrangeVerticalEven() { emit mNative->arrangeSelectedViewsToJS("V_EVEN"); }

    void groupingViews() { emit mNative->groupingViewsToJS(); }
    void ungroupingViews() { emit mNative->ungroupingViewsToJS(); }

    // for webview
    void reload();
    void showRawData();
    void showInspector();
};

#endif // N_LAYOUT_WIDGET_H
