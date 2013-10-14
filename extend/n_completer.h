#ifndef N_COMPLETER_H
#define N_COMPLETER_H

#include <QCompleter>
#include <QComboBox>
#include <QStringListModel>

/**
 * 部分一致を行うCompleter
 *
 * @example
 *
 * QLineEdit *e = new QLineEdit(this);
 * NCompleter *c = new NCompleter(e);
 * QStringList list;
 * list << "book" << "this is book" << "cook";
 * c->setStringList(list);
 * e->setCompleter(c);
 * connect(e, SIGNAL(textChanged(QString)), c, SLOT(update(QString));
 */

class NCompleter : public QCompleter
{
    Q_OBJECT
public:
    explicit NCompleter(const QStringList &list, QObject *parent = 0);
    void setStringList(const QStringList &list);

private:
    QStringList mList;
    QStringListModel *mModel;

signals:

private slots:
    void update(const QString &word);
};

#endif // N_COMPLETER_H
