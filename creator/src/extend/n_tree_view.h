#ifndef N_TREE_VIEW_H
#define N_TREE_VIEW_H

#include <QTreeView>

/**
 * 要素をドロップした時にドロップ先とドロップした要素の情報を
 * シグナルとして送信するために.QTreeViewをカスタマイズしている.
 *
 * ModelとしてQFileSystemModelを使用していることを前提としている.
 * TODO: クラス名をNFileSystemViewとかに変えたほうが良さそう.
 */
class NTreeView : public QTreeView
{
    Q_OBJECT
public:
    explicit NTreeView(QWidget *parent = 0);

protected:
    virtual void dropEvent(QDropEvent * event);

signals:
    // 要素がドロップされた時にドロップ先のディレクトリ、ドロップされたファイルの元のパスを送信する
    void dropped(QString dropDirPath, QString selectedFilePath);

public slots:

};

#endif // N_TREE_VIEW_H
